using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Scad.Inventory.Api.Errors;

public static class ValidationErrorResponseFactory
{
    public static IActionResult Create(ActionContext context)
    {
        var errors = context.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .ToDictionary(
                entry => JsonNamingPolicy.CamelCase.ConvertName(entry.Key),
                entry => entry.Value!.Errors
                    .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage)
                        ? "The supplied value is invalid."
                        : error.ErrorMessage)
                    .ToArray());

        return new BadRequestObjectResult(
            new ApiError("VALIDATION_ERROR", "The request is invalid.", errors));
    }
}
