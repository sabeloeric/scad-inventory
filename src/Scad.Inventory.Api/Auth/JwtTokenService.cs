using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Scad.Inventory.Api.Models;

namespace Scad.Inventory.Api.Auth;

public sealed class JwtTokenService(IOptions<JwtOptions> optionsAccessor)
{
    public IssuedToken Issue(User user)
    {
        var options = optionsAccessor.Value;
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(options.ExpirationMinutes);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim("username", user.Username),
            new Claim("warehouse_id", user.WarehouseId.ToString()),
            new Claim("warehouse_code", user.WarehouseCode)
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.SigningKey)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            options.Issuer,
            options.Audience,
            claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new IssuedToken(new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}

public sealed record IssuedToken(string AccessToken, DateTimeOffset ExpiresAt);
