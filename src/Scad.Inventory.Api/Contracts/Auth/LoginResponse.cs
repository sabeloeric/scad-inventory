namespace Scad.Inventory.Api.Contracts.Auth;

public sealed record LoginResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    LoginUserResponse User);
