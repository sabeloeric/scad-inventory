using System.Net;
using System.Net.Http.Json;
using Scad.Inventory.Api.Contracts.Orders;
using Scad.Inventory.Api.Contracts.Products;
using Scad.Inventory.Api.Contracts.Stock;
using Scad.Inventory.Api.Contracts.Warehouses;

namespace Scad.Inventory.IntegrationTests;

public sealed class StockTransferConcurrencyTests(InventoryApiFactory factory)
    : IClassFixture<InventoryApiFactory>, IAsyncLifetime
{
    private readonly HttpClient _client = factory.CreateAuthenticatedClient();

    public Task InitializeAsync() => factory.ResetDatabaseAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Concurrent_transfers_cannot_oversell_the_source()
    {
        await SeedSourceAsync();

        var firstTransfer = TransferAsync("CPT");
        var secondTransfer = TransferAsync("DBN");
        var responses = await Task.WhenAll(firstTransfer, secondTransfer);

        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.OK);
        Assert.Single(responses, response => response.StatusCode == HttpStatusCode.BadRequest);

        var sourceQuantity = await factory.GetStockQuantityAsync("ABC001", "JHB");
        var cptQuantity = await factory.GetStockQuantityAsync("ABC001", "CPT") ?? 0;
        var dbnQuantity = await factory.GetStockQuantityAsync("ABC001", "DBN") ?? 0;

        Assert.Equal(2, sourceQuantity);
        Assert.Equal(8, cptQuantity + dbnQuantity);
        Assert.Equal(10, await factory.GetTotalStockAsync("ABC001"));
    }

    private Task<HttpResponseMessage> TransferAsync(string destinationWarehouseCode) =>
        _client.PostAsJsonAsync(
            "/orders",
            new CreateOrderRequest("ABC001", "JHB", destinationWarehouseCode, 8));

    private async Task SeedSourceAsync()
    {
        await _client.PostAsJsonAsync("/products", new CreateProductRequest("ABC001", "Widget"));
        await _client.PostAsJsonAsync("/warehouses", new CreateWarehouseRequest("JHB", "Johannesburg"));
        await _client.PostAsJsonAsync("/warehouses", new CreateWarehouseRequest("CPT", "Cape Town"));
        await _client.PostAsJsonAsync("/warehouses", new CreateWarehouseRequest("DBN", "Durban"));
        await _client.PostAsJsonAsync("/stock", new CreateStockRequest("ABC001", "JHB", 10));
    }
}
