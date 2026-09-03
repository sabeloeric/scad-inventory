namespace Scad.Inventory.Api.Contracts.Orders;

public sealed record TransferSourceResponse(string WarehouseCode, int RemainingQuantity);
