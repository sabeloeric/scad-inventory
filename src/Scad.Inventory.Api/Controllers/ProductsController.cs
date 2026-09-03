using Microsoft.AspNetCore.Mvc;
using Scad.Inventory.Api.Contracts.Products;
using Scad.Inventory.Api.Data;
using Scad.Inventory.Api.Errors;

namespace Scad.Inventory.Api.Controllers;

[ApiController]
[Route("products")]
public sealed class ProductsController(ProductRepository productRepository) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var products = await productRepository.GetAllAsync(cancellationToken);
        return Ok(products.Select(ProductResponse.From).ToArray());
    }

    [HttpGet("{code}")]
    public async Task<ActionResult<ProductResponse>> GetByCode(
        string code,
        CancellationToken cancellationToken)
    {
        var normalizedCode = NormalizeRequiredCode(code);
        var product = await productRepository.GetByCodeAsync(normalizedCode, cancellationToken)
            ?? throw new AppException(
                StatusCodes.Status404NotFound,
                "PRODUCT_NOT_FOUND",
                $"Product '{normalizedCode}' was not found.");

        return Ok(ProductResponse.From(product));
    }

    [HttpPost]
    public async Task<ActionResult<ProductResponse>> Create(
        CreateProductRequest request,
        CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();
        var code = request.Code?.Trim().ToUpperInvariant();
        var description = request.Description?.Trim();

        if (string.IsNullOrWhiteSpace(code))
        {
            errors["code"] = ["Code is required."];
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            errors["description"] = ["Description is required."];
        }

        if (errors.Count > 0)
        {
            throw AppException.Validation(errors);
        }

        var product = await productRepository.CreateAsync(code!, description!, cancellationToken);
        var response = ProductResponse.From(product);

        return CreatedAtAction(nameof(GetByCode), new { code = response.Code }, response);
    }

    private static string NormalizeRequiredCode(string code)
    {
        var normalizedCode = code.Trim().ToUpperInvariant();

        if (normalizedCode.Length == 0)
        {
            throw AppException.Validation(
                new Dictionary<string, string[]> { ["code"] = ["Code is required."] });
        }

        return normalizedCode;
    }
}
