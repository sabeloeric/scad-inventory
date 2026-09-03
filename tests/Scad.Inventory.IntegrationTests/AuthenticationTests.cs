using System.Net;
using System.Net.Http.Json;
using Scad.Inventory.Api.Contracts.Auth;
using Scad.Inventory.Api.Contracts.Products;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.IntegrationTests;

public sealed class AuthenticationTests(InventoryApiFactory factory)
    : IClassFixture<InventoryApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();

    public async Task InitializeAsync()
    {
        await factory.ResetDatabaseAsync();
        await factory.SeedDevelopmentUsersAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Valid_login_returns_a_usable_access_token()
    {
        var loginResponse = await _client.PostAsJsonAsync(
            "/auth/login",
            new LoginRequest("jhb@scad.local", "Password123!"));

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var login = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.False(string.IsNullOrWhiteSpace(login?.AccessToken));
        Assert.Equal("jhb@scad.local", login?.User.Username);
        Assert.Equal("JHB", login?.User.WarehouseCode);
        Assert.True(login?.ExpiresAt > DateTimeOffset.UtcNow);

        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", login!.AccessToken);
        var protectedResponse = await _client.GetAsync("/products");
        Assert.Equal(HttpStatusCode.OK, protectedResponse.StatusCode);
    }

    [Theory]
    [InlineData("jhb@scad.local", "wrong-password")]
    [InlineData("missing@scad.local", "Password123!")]
    public async Task Invalid_credentials_return_the_same_safe_error(string username, string password)
    {
        var response = await _client.PostAsJsonAsync(
            "/auth/login",
            new LoginRequest(username, password));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal("INVALID_CREDENTIALS", error?.Code);
        Assert.Equal("The username or password is incorrect.", error?.Message);
    }

    [Fact]
    public async Task Protected_endpoint_without_a_token_returns_unauthorized()
    {
        var response = await _client.GetAsync("/products");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Protected_endpoint_with_an_invalid_token_returns_unauthorized()
    {
        _client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "not-a-valid-jwt");

        var response = await _client.GetAsync("/products");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Blank_login_fields_return_validation_errors()
    {
        var response = await _client.PostAsJsonAsync(
            "/auth/login",
            new LoginRequest(" ", " "));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal("VALIDATION_ERROR", error?.Code);
        Assert.Contains("username", error?.Errors?.Keys ?? []);
        Assert.Contains("password", error?.Errors?.Keys ?? []);
    }
}
