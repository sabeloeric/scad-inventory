namespace Scad.Inventory.Api.Models;

public sealed record Stock(long ProductId, long WarehouseId, int Quantity, DateTime UpdatedAt);
