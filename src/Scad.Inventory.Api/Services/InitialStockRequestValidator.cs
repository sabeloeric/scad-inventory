using Scad.Inventory.Api.Contracts.Stock;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.Api.Services;

public static class InitialStockRequestValidator
{
    public static ValidatedInitialStock Validate(CreateStockRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        var productCode = request.ProductCode?.Trim().ToUpperInvariant();
        var warehouseCode = request.WarehouseCode?.Trim().ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(productCode))
        {
            errors["productCode"] = ["Product code is required."];
        }

        if (string.IsNullOrWhiteSpace(warehouseCode))
        {
            errors["warehouseCode"] = ["Warehouse code is required."];
        }

        if (request.Quantity <= 0)
        {
            errors["quantity"] = ["Quantity must be greater than zero."];
        }

        if (errors.Count > 0)
        {
            throw AppException.Validation(errors);
        }

        return new ValidatedInitialStock(productCode!, warehouseCode!, request.Quantity);
    }
}

public sealed record ValidatedInitialStock(string ProductCode, string WarehouseCode, int Quantity);
