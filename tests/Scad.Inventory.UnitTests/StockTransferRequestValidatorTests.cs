using Scad.Inventory.Api.Contracts.Orders;
using Scad.Inventory.Api.Errors;
using Scad.Inventory.Api.Services;

namespace Scad.Inventory.UnitTests;

public sealed class StockTransferRequestValidatorTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Validate_rejects_non_positive_quantity(int quantity)
    {
        var exception = Assert.Throws<AppException>(() =>
            StockTransferRequestValidator.Validate(
                new CreateOrderRequest("ABC001", "JHB", "CPT", quantity)));

        Assert.Equal("VALIDATION_ERROR", exception.Code);
        Assert.Contains("quantity", exception.Errors?.Keys ?? []);
    }

    [Fact]
    public void Validate_rejects_self_transfer_after_normalization()
    {
        var exception = Assert.Throws<AppException>(() =>
            StockTransferRequestValidator.Validate(
                new CreateOrderRequest("ABC001", " jhb ", "JHB", 1)));

        Assert.Equal("SELF_TRANSFER_NOT_ALLOWED", exception.Code);
    }

    [Fact]
    public void Validate_normalizes_codes()
    {
        var result = StockTransferRequestValidator.Validate(
            new CreateOrderRequest(" abc001 ", " jhb ", " cpt ", 10));

        Assert.Equal(new ValidatedStockTransfer("ABC001", "JHB", "CPT", 10), result);
    }
}
