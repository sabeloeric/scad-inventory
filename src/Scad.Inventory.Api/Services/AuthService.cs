using Scad.Inventory.Api.Auth;
using Scad.Inventory.Api.Contracts.Auth;
using Scad.Inventory.Api.Data;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.Api.Services;

public sealed class AuthService(UserRepository userRepository, JwtTokenService tokenService)
{
    public async Task<LoginResponse> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var username = request.Username?.Trim();

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(request.Password))
        {
            var errors = new Dictionary<string, string[]>();

            if (string.IsNullOrWhiteSpace(username))
            {
                errors["username"] = ["Username is required."];
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                errors["password"] = ["Password is required."];
            }

            throw AppException.Validation(errors);
        }

        var user = await userRepository.GetByUsernameAsync(username, cancellationToken);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new AppException(
                StatusCodes.Status401Unauthorized,
                "INVALID_CREDENTIALS",
                "The username or password is incorrect.");
        }

        var token = tokenService.Issue(user);
        return new LoginResponse(
            token.AccessToken,
            token.ExpiresAt,
            new LoginUserResponse(user.Username, user.WarehouseCode));
    }
}
