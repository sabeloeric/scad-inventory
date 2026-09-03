using Scad.Inventory.Api.Data;
using Scad.Inventory.Api.Errors;
using Scad.Inventory.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
    options.InvalidModelStateResponseFactory = ValidationErrorResponseFactory.Create);
builder.Services.AddSingleton<IDbConnectionFactory>(
    serviceProvider => new NpgsqlConnectionFactory(
        serviceProvider.GetRequiredService<IConfiguration>().GetConnectionString("Database")
        ?? throw new InvalidOperationException("The 'ConnectionStrings:Database' setting is required.")));
builder.Services.AddScoped<ProductRepository>();
builder.Services.AddScoped<WarehouseRepository>();
builder.Services.AddScoped<StockRepository>();
builder.Services.AddScoped<StockTransferService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler();
app.MapControllers();

app.Run();

public partial class Program;
