using Scad.Inventory.Api.Data;

namespace Scad.Inventory.UnitTests;

public sealed class NpgsqlConnectionFactoryTests
{
    private const string ConnectionString =
        "Host=localhost;Port=5432;Database=scad_inventory;Username=scad_inventory;Password=test";

    [Fact]
    public void CreateConnection_returns_a_new_connection_with_the_configured_connection_string()
    {
        var factory = new NpgsqlConnectionFactory(ConnectionString);

        using var firstConnection = factory.CreateConnection();
        using var secondConnection = factory.CreateConnection();

        Assert.NotSame(firstConnection, secondConnection);
        Assert.Equal(ConnectionString, firstConnection.ConnectionString);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Constructor_rejects_a_missing_connection_string(string connectionString)
    {
        var exception = Assert.Throws<ArgumentException>(() => new NpgsqlConnectionFactory(connectionString));

        Assert.Equal("connectionString", exception.ParamName);
    }
}
