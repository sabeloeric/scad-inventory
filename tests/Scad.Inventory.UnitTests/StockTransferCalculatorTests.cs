using Scad.Inventory.Api.Errors;
using Scad.Inventory.Api.Services;

namespace Scad.Inventory.UnitTests;

public sealed class StockTransferCalculatorTests
{
    [Fact]
    public void Apply_moves_quantity_from_source_to_destination_when_stock_is_sufficient()
    {
        var result = StockTransferCalculator.Apply(
            sourceQuantity: 100,
            destinationQuantity: 20,
            transferQuantity: 30,
            sourceWarehouseCode: "JHB",
            productCode: "ABC001");

        Assert.Equal(new StockTransferResult(70, 50), result);
    }

    [Fact]
    public void Apply_allows_transferring_exactly_the_full_source_balance()
    {
        var result = StockTransferCalculator.Apply(
            sourceQuantity: 30,
            destinationQuantity: 0,
            transferQuantity: 30,
            sourceWarehouseCode: "JHB",
            productCode: "ABC001");

        Assert.Equal(new StockTransferResult(0, 30), result);
    }

    [Fact]
    public void Apply_rejects_a_transfer_that_exceeds_the_source_balance()
    {
        var exception = Assert.Throws<AppException>(() =>
            StockTransferCalculator.Apply(
                sourceQuantity: 10,
                destinationQuantity: 0,
                transferQuantity: 30,
                sourceWarehouseCode: "JHB",
                productCode: "ABC001"));

        Assert.Equal(400, exception.StatusCode);
        Assert.Equal("INSUFFICIENT_STOCK", exception.Code);
        Assert.Contains("JHB", exception.Message);
        Assert.Contains("ABC001", exception.Message);
    }

    [Fact]
    public void Apply_rejects_a_transfer_when_the_source_has_no_stock_position_at_all()
    {
        var exception = Assert.Throws<AppException>(() =>
            StockTransferCalculator.Apply(
                sourceQuantity: 0,
                destinationQuantity: 0,
                transferQuantity: 1,
                sourceWarehouseCode: "JHB",
                productCode: "ABC001"));

        Assert.Equal("INSUFFICIENT_STOCK", exception.Code);
    }
}
