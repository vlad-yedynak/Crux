using Microsoft.AspNetCore.Mvc;
using Crux.Models.EntityTypes;
using Crux.Models.Responses;
using Crux.Models.Requests;
using Crux.Services;

namespace Crux.Controllers;

[Route("card")]
public class CardController (
    IAuthenticationService authenticationService,
    ICardManagementService cardManagementService,
    IEducationalDataService educationalDataService) : ControllerBase
{
    [HttpPost("create-card")]
    public async Task<ActionResult<Response>> CreateCardAsync([FromBody] CardRequest cardRequest)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await cardManagementService.AddCardAsync(userId.Value, cardRequest);

            return new ControllerResponse<FullCardResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpPut("update-card")]
    public async Task<ActionResult<Response>> UpdateCardAsync([FromBody] CardRequest request)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await cardManagementService.UpdateCardAsync(userId.Value, request);

            return new ControllerResponse<FullCardResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpDelete("delete-card/{id:int}")]
    public async Task<ActionResult<Response>> DeleteCardAsync(int id)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await cardManagementService.DeleteCardAsync(id);

            return new ControllerResponse<bool>
            {
                Success = response,
                Body = response
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpPost("add-educational-data")]
    public async Task<ActionResult<Response>> AddEducationalDataAsync([FromBody] EducationalCardDataRequest educationalCardDataRequest)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }

            var response = await educationalDataService.AddEducationalDataAsync(educationalCardDataRequest);

            return new ControllerResponse<EducationalDataResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpPut("update-educational-data")]
    public async Task<ActionResult<Response>> UpdateEducationalDataAsync([FromBody] EducationalCardDataRequest request)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await educationalDataService.UpdateEducationalDataAsync(request);

            return new ControllerResponse<EducationalDataResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
    
    [HttpGet("get-card/{cardId:int}")]
    public async Task<ActionResult<Response>> GetCardAsync(int cardId)
    {
        try
        {
            var userId = await authenticationService.CheckAuthenticationAsync(HttpContext);
            if (userId == null)
            {
                HttpContext.Response.StatusCode = 404;
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var card = await cardManagementService.GetCardFullAsync(userId.Value, cardId);

            return new ControllerResponse<FullCardResponse>
            {
                Success = true,
                Body = card
            };
        }
        catch (Exception)
        {
            HttpContext.Response.StatusCode = 500;
            return new ControllerResponse<AuthenticationResponse>
            {
                Success = false,
                Error = "Internal Server Error"
            };
        }
    }
}
