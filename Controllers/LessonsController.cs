using Crux.Models.EntityTypes;
using Crux.Models.Requests;
using Crux.Models.Responses;
using Crux.Services;
using Microsoft.AspNetCore.Mvc;

namespace Crux.Controllers;

[Route("content")]
public class LessonsController (
    IAuthenticationService authenticationService,
    ILessonManagementService lessonManagementService,
    ICardManagementService cardManagementService,
    IQuestionService questionService,
    ITaskService taskService,
    IEducationalDataService educationalDataService) : ControllerBase
{
    [HttpPost("create-lesson")]
    public async Task<ActionResult<Response>> CreateLessonAsync([FromBody] string title)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await lessonManagementService.AddLessonAsync(HttpContext, title);

            return new ControllerResponse<LessonResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPut("update-lesson")]
    public async Task<ActionResult<Response>> UpdateLessonAsync([FromBody] UpdateLessonRequest request)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await lessonManagementService.UpdateLessonNameAsync(HttpContext, request);

            return new ControllerResponse<LessonResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpDelete("delete-lesson/{id:int}")]
    public async Task<ActionResult<Response>> UpdateLessonAsync(int id)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await lessonManagementService.DeleteLessonAsync(HttpContext, id);

            return new ControllerResponse<bool>
            {
                Success = response,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPost("create-card")]
    public async Task<ActionResult<Response>> CreateCardAsync([FromBody] CardRequest cardRequest)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await cardManagementService.AddCardAsync(HttpContext, cardRequest);

            return new ControllerResponse<FullCardResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPut("update-card")]
    public async Task<ActionResult<Response>> UpdateCardAsync([FromBody] CardRequest request)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await cardManagementService.UpdateCardAsync(HttpContext, request);

            return new ControllerResponse<FullCardResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpDelete("delete-card/{id:int}")]
    public async Task<ActionResult<Response>> DeleteCardAsync(int id)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await cardManagementService.DeleteCardAsync(HttpContext, id);

            return new ControllerResponse<bool>
            {
                Success = response,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPost("create-question")]
    public async Task<ActionResult<Response>> CreateQuestionAsync([FromBody] QuestionRequest questionRequest)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }

            var response = await questionService.AddQuestionAsync(HttpContext, questionRequest);

            return new ControllerResponse<QuestionResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<QuestionResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPut("update-question")]
    public async Task<ActionResult<Response>> UpdateQuestionAsync([FromBody] QuestionRequest request)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await questionService.UpdateQuestionAsync(HttpContext, request);

            return new ControllerResponse<QuestionResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpDelete("delete-question/{id:int}")]
    public async Task<ActionResult<Response>> DeleteQuestion(int id)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await questionService.DeleteQuestionAsync(HttpContext, id);

            return new ControllerResponse<bool>
            {
                Success = response,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPost("create-task")]
    public async Task<ActionResult<Response>> CreateTaskAsync([FromBody] TaskRequest taskRequest)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }

            var response = await taskService.AddTaskAsync(HttpContext, taskRequest);

            return new ControllerResponse<TaskResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<TaskResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPut("update-task")]
    public async Task<ActionResult<Response>> UpdateTaskAsync([FromBody] TaskRequest request)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await taskService.UpdateTaskAsync(HttpContext, request);

            return new ControllerResponse<TaskResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpDelete("delete-task/{id:int}")]
    public async Task<ActionResult<Response>> DeleteTaskAsync(int id)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await taskService.DeleteTaskAsync(HttpContext, id);

            return new ControllerResponse<bool>
            {
                Success = response,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPost("add-educational-data")]
    public async Task<ActionResult<Response>> AddEducationalDataAsync([FromBody] EducationalCardDataRequest educationalCardDataRequest)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }

            var response = await educationalDataService.AddEducationalDataAsync(HttpContext, educationalCardDataRequest);

            return new ControllerResponse<EducationalDataResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<EducationalDataResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpPut("update-educational-data")]
    public async Task<ActionResult<Response>> UpdateEducationalDataAsync([FromBody] EducationalCardDataRequest request)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext, UserRole.Admin))
            {
                return new ControllerResponse<UserResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var response = await educationalDataService.UpdateEducationalDataAsync(HttpContext, request);

            return new ControllerResponse<EducationalDataResponse>
            {
                Success = true,
                Body = response
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpGet("get-lessons")]
    public async Task<ActionResult<Response>> GetLessonsAsync()
    {
        try
        {
            var lessons = await lessonManagementService.GetLessonsAsync(HttpContext);

            return new ControllerResponse<ICollection<LessonResponse>>
            {
                Success = true,
                Body = lessons
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
    
    [HttpGet("get-card/{id:int}")]
    public async Task<ActionResult<Response>> GetCardAsync(int id)
    {
        try
        {
            if (!await authenticationService.CheckAuthenticationAsync(HttpContext))
            {
                return new ControllerResponse<AuthenticationResponse>
                {
                    Success = false,
                    Error = "Failed to authenticate user"
                };
            }
            
            var card = await cardManagementService.GetCardFullAsync(HttpContext, id);

            return new ControllerResponse<FullCardResponse>
            {
                Success = true,
                Body = card
            };
        }
        catch (Exception ex)
        {
            return new ControllerResponse<LessonResponse>
            {
                Success = false,
                Error = $"An error occured: {ex.Message}"
            };
        }
    }
}
