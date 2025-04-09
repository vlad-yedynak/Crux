using Crux.Controllers;
using Crux.Data;
using Crux.Models.Requests;
using DotNetEnv;

Env.Load();

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();

var connectionString = Environment.GetEnvironmentVariable("APP_DB_CONNECTION_STRING");
var dbContext = new ApplicationDbContext();
try
{
    dbContext.SetConnectionString(connectionString);
    dbContext.Database.EnsureCreated();
    UserController.SetDbContext(dbContext);
}
catch (Exception e)
{
    Console.WriteLine(e);
}

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/", () => "Цьомчик");

app.Run();
