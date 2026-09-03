using Scad.Inventory.Api.Contracts.Orders;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.Api.Services;

public static class StockTransferRequestValidator
{
    public static ValidatedStockTransfer Validate(CreateOrderRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        var productCode = request.ProductCode?.Trim().ToUpperInvariant();
        var sourceWarehouseCode = request.SourceWarehouseCode?.Trim().ToUpperInvariant();
        var destinationWarehouseCode = request.DestinationWarehouseCode?.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(productCode))
        {
            errors["productCode"] = ["Product code is required."];
        }

        if (string.IsNullOrWhiteSpace(sourceWarehouseCode))
        {
            errors["sourceWarehouseCode"] = ["Source warehouse code is required."];
        }

        if (string.IsNullOrWhiteSpace(destinationWarehouseCode))
        {
            errors["destinationWarehouseCode"] = ["Destination warehouse code is required."];
        }

        if (request.Quantity <= 0)
        {
            errors["quantity"] = ["Quantity must be greater than zero."];
        }

        if (errors.Count > 0)
        {
            throw AppException.Validation(errors);
        }

        if (sourceWarehouseCode == destinationWarehouseCode)
        {
            throw new AppException(
                StatusCodes.Status400BadRequest,
                "SELF_TRANSFER_NOT_ALLOWED",
                "Source and destination warehouses must be different.");
        }

        return new ValidatedStockTransfer(
            productCode!,
            sourceWarehouseCode!,
            destinationWarehouseCode!,
            request.Quantity);
    }
}

public sealed record ValidatedStockTransfer(
    string ProductCode,
    string SourceWarehouseCode,
    string DestinationWarehouseCode,
    int Quantity);
