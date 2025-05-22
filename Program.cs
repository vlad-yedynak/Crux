using Crux.Data;
using Crux.Models.Entities;
using Crux.Services;
using DotNetEnv;
using Microsoft.AspNetCore.Identity;
using MySql.EntityFrameworkCore.Extensions;
using Microsoft.OpenApi.Models;

Env.Load();

var connectionString = Environment.GetEnvironmentVariable("APP_DB_CONNECTION_STRING");
if (string.IsNullOrEmpty(connectionString))
{
    throw new Exception("DB connection string not found");
}

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDistributedMemoryCache();
builder.Services.AddDbContext<ApplicationDbContext>();
builder.Services.AddMySQLServer<ApplicationDbContext>(connectionString);
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthenticationService, AuthenticationService>();
builder.Services.AddScoped<ILessonManagementService, LessonManagementService>();
builder.Services.AddScoped<ICardManagementService, CardManagementService>();
builder.Services.AddScoped<IQuestionService, QuestionService>();
builder.Services.AddScoped<IEducationalDataService, EducationalDataService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ITestService, TestService>();
builder.Services.AddScoped<ILessonTrackerService, LessonTrackerService>();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { 
        Title = "Crux API", 
        Version = "v1",
        Description = "API for the Crux application"
    });
});

var app = builder.Build();
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseCors(option => option.WithOrigins("http://localhost:4200")
    .AllowAnyMethod()
    .AllowAnyHeader());

app.UseAuthorization();
app.UseAuthentication();

app.MapControllers();

app.MapGet("/", () => "Цьомчик");

app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Crux API v1");
    c.RoutePrefix = "swagger";
});

app.Run();
