using Scad.Inventory.Api.Models;

namespace Scad.Inventory.Api.Contracts.Stock;

public sealed record StockItemResponse(
    string ProductCode,
    string ProductDescription,
    string WarehouseCode,
    string WarehouseName,
    int Quantity)
{
    public static StockItemResponse From(StockItem stock) =>
        new(
            stock.ProductCode,
            stock.ProductDescription,
            stock.WarehouseCode,
            stock.WarehouseName,
            stock.Quantity);
}
