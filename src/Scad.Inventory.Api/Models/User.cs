namespace Scad.Inventory.Api.Models;

public sealed record User(
    long Id,
    string Username,
    string PasswordHash,
    long WarehouseId,
    string WarehouseCode);
