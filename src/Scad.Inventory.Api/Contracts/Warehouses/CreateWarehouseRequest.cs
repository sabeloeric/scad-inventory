using System.ComponentModel.DataAnnotations;

namespace Scad.Inventory.Api.Contracts.Warehouses;

public sealed record CreateWarehouseRequest(
    [Required(ErrorMessage = "Code is required.")] string? Code,
    [Required(ErrorMessage = "Name is required.")] string? Name);
