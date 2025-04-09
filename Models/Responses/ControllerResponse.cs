using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Models.Responses;

public class ControllerResponse
{
    [JsonPropertyName("success")]
    public required bool Success { get; set; } = true;

    [JsonPropertyName("error")]
    public required string? Error { get; set; }
    
    [JsonPropertyName("body")]
    public string? Body { get; set; }
        
    public static ControllerResponse CreateSuccess(string body)
    {
        return new ControllerResponse
        {
            Success = true,
            Body = body,
            Error = null
        };
    }
        
    public static ControllerResponse CreateError(string errorMessage)
    {
        return new ControllerResponse
        {
            Success = false,
            Error = errorMessage
        };
    }
    
}