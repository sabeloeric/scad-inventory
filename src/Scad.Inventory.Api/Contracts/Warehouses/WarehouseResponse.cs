using Scad.Inventory.Api.Models;

namespace Scad.Inventory.Api.Contracts.Warehouses;

public sealed record WarehouseResponse(string Code, string Name)
{
    public static WarehouseResponse From(Warehouse warehouse) => new(warehouse.Code, warehouse.Name);
}
