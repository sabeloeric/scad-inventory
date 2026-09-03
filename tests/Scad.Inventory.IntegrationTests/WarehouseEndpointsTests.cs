using System.Net;
using System.Net.Http.Json;
using Scad.Inventory.Api.Contracts.Warehouses;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.IntegrationTests;

public sealed class WarehouseEndpointsTests(InventoryApiFactory factory)
    : IClassFixture<InventoryApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();

    public Task InitializeAsync() => factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Get_warehouses_returns_an_empty_array_when_none_exist()
    {
        var response = await _client.GetAsync("/warehouses");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var warehouses = await response.Content.ReadFromJsonAsync<WarehouseResponse[]>();
        Assert.NotNull(warehouses);
        Assert.Empty(warehouses);
    }

    [Fact]
    public async Task Create_warehouse_normalizes_code_and_name()
    {
        var response = await _client.PostAsJsonAsync(
            "/warehouses",
            new CreateWarehouseRequest(" jhb ", " Johannesburg Warehouse "));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("/warehouses/JHB", response.Headers.Location?.OriginalString);
        var warehouse = await response.Content.ReadFromJsonAsync<WarehouseResponse>();
        Assert.Equal(new WarehouseResponse("JHB", "Johannesburg Warehouse"), warehouse);
    }

    [Fact]
    public async Task Duplicate_normalized_warehouse_code_returns_conflict()
    {
        var firstResponse = await _client.PostAsJsonAsync(
            "/warehouses",
            new CreateWarehouseRequest("jhb", "First"));
        var duplicateResponse = await _client.PostAsJsonAsync(
            "/warehouses",
            new CreateWarehouseRequest(" JHB ", "Second"));

        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);
        var error = await duplicateResponse.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal("DUPLICATE_WAREHOUSE_CODE", error?.Code);
    }

    [Fact]
    public async Task Whitespace_warehouse_fields_return_validation_error()
    {
        var response = await _client.PostAsJsonAsync(
            "/warehouses",
            new CreateWarehouseRequest(" ", " "));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal("VALIDATION_ERROR", error?.Code);
        Assert.Contains("code", error?.Errors?.Keys ?? []);
        Assert.Contains("name", error?.Errors?.Keys ?? []);
    }
}
