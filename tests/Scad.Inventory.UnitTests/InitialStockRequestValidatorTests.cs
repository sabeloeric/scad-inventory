using Scad.Inventory.Api.Contracts.Stock;
using Scad.Inventory.Api.Errors;
using Scad.Inventory.Api.Services;

namespace Scad.Inventory.UnitTests;

public sealed class InitialStockRequestValidatorTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_rejects_non_positive_quantity(int quantity)
    {
        var exception = Assert.Throws<AppException>(
            () => InitialStockRequestValidator.Validate(new CreateStockRequest("ABC001", "JHB", quantity)));

        Assert.Equal("VALIDATION_ERROR", exception.Code);
        Assert.Contains("quantity", exception.Errors?.Keys ?? []);
    }

    [Fact]
    public void Validate_normalizes_codes()
    {
        var result = InitialStockRequestValidator.Validate(
            new CreateStockRequest(" abc001 ", " jhb ", 10));

        Assert.Equal(new ValidatedInitialStock("ABC001", "JHB", 10), result);
    }
}
