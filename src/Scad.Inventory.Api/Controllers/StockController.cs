using Microsoft.AspNetCore.Mvc;
using Scad.Inventory.Api.Auth;
using Scad.Inventory.Api.Contracts.Stock;
using Scad.Inventory.Api.Data;
using Scad.Inventory.Api.Errors;
using Scad.Inventory.Api.Services;

namespace Scad.Inventory.Api.Controllers;

[ApiController]
[Route("stock")]
public sealed class StockController(StockRepository stockRepository, CurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StockItemResponse>>> Get(
        [FromQuery] string? productCode,
        [FromQuery] string? warehouseCode,
        CancellationToken cancellationToken)
    {
        var normalizedProductCode = NormalizeOptionalCode(productCode, "productCode");
        var normalizedWarehouseCode = NormalizeOptionalCode(warehouseCode, "warehouseCode");

        if (normalizedWarehouseCode is not null
            && normalizedWarehouseCode != currentUser.WarehouseCode)
        {
            throw new AppException(
                StatusCodes.Status403Forbidden,
                "FORBIDDEN",
                "Stock for another warehouse cannot be accessed.");
        }

        var stock = await stockRepository.GetAsync(
            currentUser.WarehouseId,
            normalizedProductCode,
            normalizedWarehouseCode,
            cancellationToken);

        return Ok(stock.Select(StockItemResponse.From).ToArray());
    }

    [HttpPost]
    public async Task<ActionResult<StockResponse>> Create(
        CreateStockRequest request,
        CancellationToken cancellationToken)
    {
        var input = InitialStockRequestValidator.Validate(request);
        var stock = await stockRepository.AddAsync(
            input.ProductCode,
            input.WarehouseCode,
            input.Quantity,
            cancellationToken);
        var response = new StockResponse(input.ProductCode, input.WarehouseCode, stock.Quantity);

        return Created(
            $"/stock?productCode={input.ProductCode}&warehouseCode={input.WarehouseCode}",
            response);
    }

    private static string? NormalizeOptionalCode(string? code, string fieldName)
    {
        if (code is null)
        {
            return null;
        }

        var normalizedCode = code.Trim().ToUpperInvariant();

        if (normalizedCode.Length == 0)
        {
            throw AppException.Validation(
                new Dictionary<string, string[]> { [fieldName] = ["Code cannot be empty."] });
        }

        return normalizedCode;
    }
}
