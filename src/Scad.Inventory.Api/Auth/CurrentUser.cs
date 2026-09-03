using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.Api.Auth;

public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor)
{
    public long WarehouseId => long.TryParse(GetClaim("warehouse_id"), out var warehouseId)
        ? warehouseId
        : throw InvalidToken();

    public string WarehouseCode => GetClaim("warehouse_code");

    private string GetClaim(string claimType) =>
        httpContextAccessor.HttpContext?.User.FindFirst(claimType)?.Value
        ?? throw InvalidToken();

    private static AppException InvalidToken() =>
        new(StatusCodes.Status401Unauthorized, "INVALID_TOKEN", "The access token is invalid.");
}
