using System.ComponentModel.DataAnnotations;

namespace Scad.Inventory.Api.Contracts.Auth;

public sealed record LoginRequest(
    [Required(ErrorMessage = "Username is required.")] string? Username,
    [Required(ErrorMessage = "Password is required.")] string? Password);
