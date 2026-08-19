import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import { Project } from "../projects/project.entity";
import { User } from "../users/user.entity";

export enum ProjectMemberRole {
  EDITOR = "EDITOR",
  VIEWER = "VIEWER",
}

@Entity({ name: "project_members" })
@Unique(["projectId", "userId"])
export class ProjectMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  projectId!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @Column({
    type: "enum",
    enum: ProjectMemberRole,
  })
  role!: ProjectMemberRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @ManyToOne(() => Project, {
    onDelete: "CASCADE",
  })
  project!: Project;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  user!: User;
}