namespace Scad.Inventory.Api.Contracts.Stock;

public sealed record StockResponse(string ProductCode, string WarehouseCode, int Quantity);
