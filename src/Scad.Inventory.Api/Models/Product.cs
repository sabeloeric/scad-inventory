namespace Scad.Inventory.Api.Models;

public sealed record Product(long Id, string Code, string Description, DateTime CreatedAt);
