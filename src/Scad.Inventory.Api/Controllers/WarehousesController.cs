using Microsoft.AspNetCore.Mvc;
using Scad.Inventory.Api.Contracts.Warehouses;
using Scad.Inventory.Api.Data;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.Api.Controllers;

[ApiController]
[Route("warehouses")]
public sealed class WarehousesController(WarehouseRepository warehouseRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<WarehouseResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var warehouses = await warehouseRepository.GetAllAsync(cancellationToken);
        return Ok(warehouses.Select(WarehouseResponse.From).ToArray());
    }

    [HttpPost]
    public async Task<ActionResult<WarehouseResponse>> Create(
        CreateWarehouseRequest request,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        var code = request.Code?.Trim().ToUpperInvariant();
        var name = request.Name?.Trim();

        if (string.IsNullOrWhiteSpace(code))
        {
            errors["code"] = ["Code is required."];
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            errors["name"] = ["Name is required."];
        }

        if (errors.Count > 0)
        {
            throw AppException.Validation(errors);
        }

        var warehouse = await warehouseRepository.CreateAsync(code!, name!, cancellationToken);
        var response = WarehouseResponse.From(warehouse);

        return Created($"/warehouses/{response.Code}", response);
    }
}
