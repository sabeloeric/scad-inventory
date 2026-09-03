using System.ComponentModel.DataAnnotations;

namespace Scad.Inventory.Api.Contracts.Products;

public sealed record CreateProductRequest(
    [Required(ErrorMessage = "Code is required.")] string? Code,
    [Required(ErrorMessage = "Description is required.")] string? Description);
