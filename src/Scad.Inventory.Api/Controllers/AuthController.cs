using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Scad.Inventory.Api.Contracts.Auth;
using Scad.Inventory.Api.Services;

namespace Scad.Inventory.Api.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController(AuthService authService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken) =>
        Ok(await authService.LoginAsync(request, cancellationToken));
}
