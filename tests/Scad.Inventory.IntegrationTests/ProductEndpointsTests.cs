using System.Net;
using System.Net.Http.Json;
using Scad.Inventory.Api.Contracts.Products;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.IntegrationTests;

public sealed class ProductEndpointsTests(InventoryApiFactory factory)
    : IClassFixture<InventoryApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();

    public Task InitializeAsync() => factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Get_products_returns_an_empty_array_when_no_products_exist()
    {
        var response = await _client.GetAsync("/products");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var products = await response.Content.ReadFromJsonAsync<ProductResponse[]>();
        Assert.NotNull(products);
        Assert.Empty(products);
    }

    [Fact]
    public async Task Create_product_normalizes_fields_and_supports_detail_lookup()
    {
        var createResponse = await _client.PostAsJsonAsync(
            "/products",
            new CreateProductRequest(" inv001 ", " Inventory widget "));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.Equal("/products/INV001", createResponse.Headers.Location?.AbsolutePath);
        var created = await createResponse.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.Equal(new ProductResponse("INV001", "Inventory widget"), created);

        var detailResponse = await _client.GetAsync("/products/inv001");
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);
        var detail = await detailResponse.Content.ReadFromJsonAsync<ProductResponse>();
        Assert.Equal(created, detail);
    }

    [Fact]
    public async Task Duplicate_normalized_product_code_returns_conflict()
    {
        var firstResponse = await _client.PostAsJsonAsync(
            "/products",
            new CreateProductRequest("inv001", "First"));
        var duplicateResponse = await _client.PostAsJsonAsync(
            "/products",
            new CreateProductRequest(" INV001 ", "Second"));

        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);
        var error = await duplicateResponse.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal("DUPLICATE_PRODUCT_CODE", error?.Code);
    }

    [Fact]
    public async Task Whitespace_product_fields_return_validation_error()
    {
        var response = await _client.PostAsJsonAsync(
            "/products",
            new CreateProductRequest(" ", " "));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal("VALIDATION_ERROR", error?.Code);
        Assert.Contains("code", error?.Errors?.Keys ?? []);
        Assert.Contains("description", error?.Errors?.Keys ?? []);
    }

    [Fact]
    public async Task Unknown_product_returns_not_found()
    {
        var response = await _client.GetAsync("/products/missing");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal("PRODUCT_NOT_FOUND", error?.Code);
    }
}
