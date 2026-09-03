using System.ComponentModel.DataAnnotations;

namespace Scad.Inventory.Api.Contracts.Orders;

public sealed record CreateOrderRequest(
    [Required(ErrorMessage = "Product code is required.")] string? ProductCode,
    [Required(ErrorMessage = "Source warehouse code is required.")] string? SourceWarehouseCode,
    [Required(ErrorMessage = "Destination warehouse code is required.")] string? DestinationWarehouseCode,
    int Quantity);
