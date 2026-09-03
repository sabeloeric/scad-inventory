using Microsoft.AspNetCore.Mvc;
using Scad.Inventory.Api.Contracts.Orders;
using Scad.Inventory.Api.Services;

namespace Scad.Inventory.Api.Controllers;

[ApiController]
[Route("orders")]
public sealed class OrdersController(StockTransferService transferService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<TransferResponse>> Create(
        CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        var input = StockTransferRequestValidator.Validate(request);
        return Ok(await transferService.TransferAsync(input, cancellationToken));
    }
}
