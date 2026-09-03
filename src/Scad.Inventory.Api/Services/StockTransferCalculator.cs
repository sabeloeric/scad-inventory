using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.Api.Services;

public static class StockTransferCalculator
{
    public static StockTransferResult Apply(
        int sourceQuantity,
        int destinationQuantity,
        int transferQuantity,
        string sourceWarehouseCode,
        string productCode)
    {
        if (sourceQuantity < transferQuantity)
        {
            throw new AppException(
                StatusCodes.Status400BadRequest,
                "INSUFFICIENT_STOCK",
                $"Warehouse '{sourceWarehouseCode}' has insufficient stock for product '{productCode}'.");
        }

        return new StockTransferResult(
            sourceQuantity - transferQuantity,
            destinationQuantity + transferQuantity);
    }
}

public sealed record StockTransferResult(int SourceRemaining, int DestinationQuantity);
