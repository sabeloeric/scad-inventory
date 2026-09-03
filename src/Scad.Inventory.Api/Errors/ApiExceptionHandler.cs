using Microsoft.AspNetCore.Diagnostics;

namespace Scad.Inventory.Api.Errors;

public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        ApiError response;

        if (exception is AppException appException)
        {
            httpContext.Response.StatusCode = appException.StatusCode;
            response = new ApiError(
                appException.Code,
                appException.Message,
                appException.Errors);
        }
        else
        {
            logger.LogError(exception, "An unexpected API error occurred.");
            httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
            response = new ApiError("INTERNAL_ERROR", "An unexpected error occurred.");
        }

        await httpContext.Response.WriteAsJsonAsync(response, cancellationToken);
        return true;
    }
}
