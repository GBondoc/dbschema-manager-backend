import { IsEnum, IsInt, Max, Min } from "class-validator";
import { ProjectMemberRole } from "../../project-members/project-member.entity";

export class CreateProjectInviteDto {
  @IsEnum(ProjectMemberRole)
  role!: ProjectMemberRole;

  @IsInt()
  @Min(5)
  @Max(1440)
  expiresInMinutes!: number;
}