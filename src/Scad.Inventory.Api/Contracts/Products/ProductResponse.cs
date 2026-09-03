using Scad.Inventory.Api.Models;

namespace Scad.Inventory.Api.Contracts.Products;

public sealed record ProductResponse(string Code, string Description)
{
    public static ProductResponse From(Product product) => new(product.Code, product.Description);
}
