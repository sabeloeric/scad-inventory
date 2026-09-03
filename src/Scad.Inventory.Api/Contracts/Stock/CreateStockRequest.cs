using System.ComponentModel.DataAnnotations;

namespace Scad.Inventory.Api.Contracts.Stock;

public sealed record CreateStockRequest(
    [Required(ErrorMessage = "Product code is required.")] string? ProductCode,
    [Required(ErrorMessage = "Warehouse code is required.")] string? WarehouseCode,
    int Quantity);
