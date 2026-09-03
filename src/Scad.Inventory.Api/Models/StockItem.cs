namespace Scad.Inventory.Api.Models;

public sealed record StockItem(
    string ProductCode,
    string ProductDescription,
    string WarehouseCode,
    string WarehouseName,
    int Quantity);
