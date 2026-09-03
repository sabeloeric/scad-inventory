using Microsoft.AspNetCore.Mvc;
using Scad.Inventory.Api.Contracts.Stock;
using Scad.Inventory.Api.Data;
using Scad.Inventory.Api.Services;

namespace Scad.Inventory.Api.Controllers;

[ApiController]
[Route("stock")]
public sealed class StockController(StockRepository stockRepository) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<StockResponse>> Create(
        CreateStockRequest request,
        CancellationToken cancellationToken)
    {
        var input = InitialStockRequestValidator.Validate(request);
        var stock = await stockRepository.CreateAsync(
            input.ProductCode,
            input.WarehouseCode,
            input.Quantity,
            cancellationToken);
        var response = new StockResponse(input.ProductCode, input.WarehouseCode, stock.Quantity);

        return Created(
            $"/stock?productCode={input.ProductCode}&warehouseCode={input.WarehouseCode}",
            response);
    }
}
