using System.Net.Http.Headers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Dapper;
using Npgsql;
using Scad.Inventory.Api.Auth;
using Scad.Inventory.Api.Models;
using Testcontainers.PostgreSql;

namespace Scad.Inventory.IntegrationTests;

public sealed class InventoryApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private const string TestSigningKey = "test-only-signing-key-with-at-least-32-characters";

    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:17-alpine")
        .WithDatabase("scad_inventory_tests")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        await ApplyDatabaseScriptsAsync();
    }

    public async Task ResetDatabaseAsync()
    {
        const string sql = """
            TRUNCATE TABLE stock, users, products, warehouses RESTART IDENTITY CASCADE;
            """;

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync();
    }

    public HttpClient CreateAuthenticatedClient(long warehouseId = 1, string warehouseCode = "TEST")
    {
        var client = CreateClient();
        var tokenService = Services.GetRequiredService<JwtTokenService>();
        var token = tokenService.Issue(
            new User(1, "test@scad.local", string.Empty, warehouseId, warehouseCode));
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token.AccessToken);
        return client;
    }

    public async Task SeedDevelopmentUsersAsync()
    {
        const string sql = """
            INSERT INTO warehouses (code, name)
            VALUES
                ('JHB', 'Johannesburg Warehouse'),
                ('CPT', 'Cape Town Warehouse');

            INSERT INTO users (username, password_hash, warehouse_id)
            SELECT seeded_user.username, seeded_user.password_hash, warehouses.id
            FROM (
                VALUES
                    ('jhb@scad.local', '$2b$12$go5SzFKWYAA0mnszafdl/.pTWYVquKkMXjep5Oun/I9XGcBH7J1Ee', 'JHB'),
                    ('cpt@scad.local', '$2b$12$go5SzFKWYAA0mnszafdl/.pTWYVquKkMXjep5Oun/I9XGcBH7J1Ee', 'CPT')
            ) AS seeded_user(username, password_hash, warehouse_code)
            JOIN warehouses ON warehouses.code = seeded_user.warehouse_code;
            """;

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();
        await connection.ExecuteAsync(sql);
    }

    public async Task<long> GetWarehouseIdAsync(string code)
    {
        const string sql = "SELECT id FROM warehouses WHERE code = @Code;";

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        return await connection.QuerySingleAsync<long>(sql, new { Code = code });
    }

    public async Task<int?> GetStockQuantityAsync(string productCode, string warehouseCode)
    {
        const string sql = """
            SELECT stock.quantity
            FROM stock
            JOIN products ON products.id = stock.product_id
            JOIN warehouses ON warehouses.id = stock.warehouse_id
            WHERE products.code = @ProductCode
              AND warehouses.code = @WarehouseCode;
            """;

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        return await connection.QuerySingleOrDefaultAsync<int?>(
            sql,
            new { ProductCode = productCode, WarehouseCode = warehouseCode });
    }

    public async Task<int> GetTotalStockAsync(string productCode)
    {
        const string sql = """
            SELECT COALESCE(SUM(stock.quantity), 0)::INTEGER
            FROM stock
            JOIN products ON products.id = stock.product_id
            WHERE products.code = @ProductCode;
            """;

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        return await connection.QuerySingleAsync<int>(sql, new { ProductCode = productCode });
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
            configuration.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:Database"] = _postgres.GetConnectionString(),
                    ["Jwt:Issuer"] = "scad-inventory-tests",
                    ["Jwt:Audience"] = "scad-inventory-tests",
                    ["Jwt:SigningKey"] = TestSigningKey,
                    ["Jwt:ExpirationMinutes"] = "5"
                }));
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _postgres.DisposeAsync();
        Dispose();
    }

    private async Task ApplyDatabaseScriptsAsync()
    {
        var schema = await File.ReadAllTextAsync(
            Path.Combine(AppContext.BaseDirectory, "database", "001_schema.sql"));
        var seed = await File.ReadAllTextAsync(
            Path.Combine(AppContext.BaseDirectory, "database", "002_seed.sql"));

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand($"{schema}\n{seed}", connection);
        await command.ExecuteNonQueryAsync();
    }
}
