using System.Net;
using System.Net.Http.Json;
using Scad.Inventory.Api.Contracts.Orders;
using Scad.Inventory.Api.Contracts.Products;
using Scad.Inventory.Api.Contracts.Stock;
using Scad.Inventory.Api.Contracts.Warehouses;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.IntegrationTests;

public sealed class StockTransferEndpointsTests(InventoryApiFactory factory)
    : IClassFixture<InventoryApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateAuthenticatedClient();

    public Task InitializeAsync() => factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Transfer_updates_both_warehouses_and_conserves_inventory()
    {
        await SeedTransferAsync(sourceQuantity: 100, destinationQuantity: 20);

        var response = await TransferAsync(30);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var transfer = await response.Content.ReadFromJsonAsync<TransferResponse>();
        Assert.Equal("ABC001", transfer?.ProductCode);
        Assert.Equal(30, transfer?.QuantityTransferred);
        Assert.Equal(new TransferSourceResponse("JHB", 70), transfer?.Source);
        Assert.Equal(new TransferDestinationResponse("CPT", 50), transfer?.Destination);
        Assert.Equal(70, await factory.GetStockQuantityAsync("ABC001", "JHB"));
        Assert.Equal(50, await factory.GetStockQuantityAsync("ABC001", "CPT"));
        Assert.Equal(120, await factory.GetTotalStockAsync("ABC001"));
    }

    [Fact]
    public async Task Transfer_creates_a_missing_destination_stock_row()
    {
        await SeedTransferAsync(sourceQuantity: 10);

        var response = await TransferAsync(4);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(6, await factory.GetStockQuantityAsync("ABC001", "JHB"));
        Assert.Equal(4, await factory.GetStockQuantityAsync("ABC001", "CPT"));
        Assert.Equal(10, await factory.GetTotalStockAsync("ABC001"));
    }

    [Fact]
    public async Task Insufficient_stock_rolls_back_both_warehouses()
    {
        await SeedTransferAsync(sourceQuantity: 5, destinationQuantity: 3);

        var response = await TransferAsync(8);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal("INSUFFICIENT_STOCK", error?.Code);
        Assert.Equal(5, await factory.GetStockQuantityAsync("ABC001", "JHB"));
        Assert.Equal(3, await factory.GetStockQuantityAsync("ABC001", "CPT"));
        Assert.Equal(8, await factory.GetTotalStockAsync("ABC001"));
    }

    [Fact]
    public async Task Missing_source_stock_is_treated_as_insufficient()
    {
        await SeedTransferAsync(destinationQuantity: 3);

        var response = await TransferAsync(1);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal("INSUFFICIENT_STOCK", error?.Code);
        Assert.Null(await factory.GetStockQuantityAsync("ABC001", "JHB"));
        Assert.Equal(3, await factory.GetStockQuantityAsync("ABC001", "CPT"));
    }

    [Theory]
    [InlineData("MISSING", "JHB", "CPT", "PRODUCT_NOT_FOUND")]
    [InlineData("ABC001", "MISSING", "CPT", "WAREHOUSE_NOT_FOUND")]
    [InlineData("ABC001", "JHB", "MISSING", "WAREHOUSE_NOT_FOUND")]
    public async Task Unknown_codes_return_not_found(
        string productCode,
        string sourceWarehouseCode,
        string destinationWarehouseCode,
        string expectedCode)
    {
        await SeedTransferAsync(sourceQuantity: 5);

        var response = await _client.PostAsJsonAsync(
            "/orders",
            new CreateOrderRequest(productCode, sourceWarehouseCode, destinationWarehouseCode, 1));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var error = await response.Content.ReadFromJsonAsync<ApiError>();
        Assert.Equal(expectedCode, error?.Code);
    }

    private Task<HttpResponseMessage> TransferAsync(int quantity) =>
        _client.PostAsJsonAsync(
            "/orders",
            new CreateOrderRequest("ABC001", "JHB", "CPT", quantity));

    private async Task SeedTransferAsync(int? sourceQuantity = null, int? destinationQuantity = null)
    {
        await _client.PostAsJsonAsync("/products", new CreateProductRequest("ABC001", "Widget"));
        await _client.PostAsJsonAsync("/warehouses", new CreateWarehouseRequest("JHB", "Johannesburg"));
        await _client.PostAsJsonAsync("/warehouses", new CreateWarehouseRequest("CPT", "Cape Town"));

        if (sourceQuantity is not null)
        {
            await _client.PostAsJsonAsync(
                "/stock",
                new CreateStockRequest("ABC001", "JHB", sourceQuantity.Value));
        }

        if (destinationQuantity is not null)
        {
            await _client.PostAsJsonAsync(
                "/stock",
                new CreateStockRequest("ABC001", "CPT", destinationQuantity.Value));
        }
    }
}
