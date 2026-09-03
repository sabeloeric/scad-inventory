using Dapper;
using Npgsql;
using Scad.Inventory.Api.Errors;
using Scad.Inventory.Api.Models;

namespace Scad.Inventory.Api.Data;

public sealed class ProductRepository(IDbConnectionFactory connectionFactory)
{
    public async Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT id, code, description, created_at AS CreatedAt
            FROM products
            ORDER BY code;
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        var products = await connection.QueryAsync<Product>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return products.AsList();
    }

    public async Task<Product?> GetByCodeAsync(string code, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT id, code, description, created_at AS CreatedAt
            FROM products
            WHERE code = @Code;
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<Product>(
            new CommandDefinition(sql, new { Code = code }, cancellationToken: cancellationToken));
    }

    public async Task<Product> CreateAsync(
        string code,
        string description,
        CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO products (code, description)
            VALUES (@Code, @Description)
            RETURNING id, code, description, created_at AS CreatedAt;
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        try
        {
            return await connection.QuerySingleAsync<Product>(
                new CommandDefinition(
                    sql,
                    new { Code = code, Description = description },
                    cancellationToken: cancellationToken));
        }
        catch (PostgresException exception)
            when (exception.SqlState == PostgresErrorCodes.UniqueViolation
                  && exception.ConstraintName == "uq_products_code")
        {
            throw new AppException(
                StatusCodes.Status409Conflict,
                "DUPLICATE_PRODUCT_CODE",
                $"Product code '{code}' already exists.");
        }
    }
}
