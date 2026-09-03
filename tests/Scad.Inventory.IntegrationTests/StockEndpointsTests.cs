using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Scad.Inventory.Api.Contracts.Products;
using Scad.Inventory.Api.Contracts.Stock;
using Scad.Inventory.Api.Contracts.Warehouses;
using Scad.Inventory.Api.Data;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.IntegrationTests;

public sealed class StockEndpointsTests(InventoryApiFactory factory)
    : IClassFixture<InventoryApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateClient();

    public Task InitializeAsync() => factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Create_initial_stock_returns_created_quantity()
    {
        await CreateProductAndWarehouseAsync("ABC001", "JHB");

        var response = await _client.PostAsJsonAsync(
            "/stock",
            new CreateStockRequest(" abc001 ", " jhb ", 25));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var stock = await response.Content.ReadFromJsonAsync<StockResponse>();
        Assert.Equal(new StockResponse("ABC001", "JHB", 25), stock);
    }

    [Fact]
    public async Task Duplicate_initial_stock_returns_conflict()
    {
        await CreateProductAndWarehouseAsync("ABC001", "JHB");
        var request = new CreateStockRequest("ABC001", "JHB", 25);

        var firstResponse = await _client.PostAsJsonAsync("/stock", request);
        var duplicateResponse = await _client.PostAsJsonAsync("/stock", request);

        Assert.Equal(HttpStatusCode.Created, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);
        var error = await duplicateResponse.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal("STOCK_ALREADY_EXISTS", error?.Code);
    }

    [Theory]
    [InlineData("MISSING", "JHB", "PRODUCT_NOT_FOUND")]
    [InlineData("ABC001", "MISSING", "WAREHOUSE_NOT_FOUND")]
    public async Task Unknown_codes_return_not_found(
        string productCode,
        string warehouseCode,
        string expectedCode)
    {
        await CreateProductAndWarehouseAsync("ABC001", "JHB");

        var response = await _client.PostAsJsonAsync(
            "/stock",
            new CreateStockRequest(productCode, warehouseCode, 10));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(expectedCode, error?.Code);
    }

    [Fact]
    public async Task Scoped_query_returns_only_the_authorized_warehouse()
    {
        await _client.PostAsJsonAsync("/products", new CreateProductRequest("ABC001", "Widget"));
        await _client.PostAsJsonAsync("/warehouses", new CreateWarehouseRequest("JHB", "Johannesburg"));
        await _client.PostAsJsonAsync("/warehouses", new CreateWarehouseRequest("CPT", "Cape Town"));
        await _client.PostAsJsonAsync("/stock", new CreateStockRequest("ABC001", "JHB", 100));
        await _client.PostAsJsonAsync("/stock", new CreateStockRequest("ABC001", "CPT", 20));

        var jhbId = await factory.GetWarehouseIdAsync("JHB");
        await using var scope = factory.Services.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<StockRepository>();

        var stock = await repository.GetAsync(jhbId, "ABC001", null, CancellationToken.None);

        var item = Assert.Single(stock);
        Assert.Equal("JHB", item.WarehouseCode);
        Assert.Equal(100, item.Quantity);
    }

    private async Task CreateProductAndWarehouseAsync(string productCode, string warehouseCode)
    {
        await _client.PostAsJsonAsync(
            "/products",
            new CreateProductRequest(productCode, "Widget"));
        await _client.PostAsJsonAsync(
            "/warehouses",
            new CreateWarehouseRequest(warehouseCode, "Warehouse"));
    }
}
