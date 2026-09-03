namespace Scad.Inventory.Api.Contracts.Orders;

public sealed record TransferResponse(
    string ProductCode,
    int QuantityTransferred,
    TransferSourceResponse Source,
    TransferDestinationResponse Destination);
