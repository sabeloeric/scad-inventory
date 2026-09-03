using Npgsql;

namespace Scad.Inventory.Api.Data;

public interface IDbConnectionFactory
{
    NpgsqlConnection CreateConnection();
}
