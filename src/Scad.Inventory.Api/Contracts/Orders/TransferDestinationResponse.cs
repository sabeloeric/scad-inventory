namespace Scad.Inventory.Api.Contracts.Orders;

public sealed record TransferDestinationResponse(string WarehouseCode, int Quantity);
