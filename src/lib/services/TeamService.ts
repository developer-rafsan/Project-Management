import { connectDB } from '@/lib/mongodb'
import Team from '@/models/Team'
import TeamMembership from '@/models/TeamMembership'

export class TeamService {
  async createTeam(data: { name: string; description?: string; workspace: string }, userId: string) {
    await connectDB()
    const team = await Team.create({
      name: data.name,
      description: data.description || '',
      workspace: data.workspace,
      lead: userId,
    })
    await TeamMembership.create({
      team: team._id,
      user: userId,
      role: 'lead',
    })
    return team.toObject()
  }

  async getWorkspaceTeams(workspaceId: string) {
    await connectDB()
    return Team.find({ workspace: workspaceId })
      .populate('lead', '_id name email image')
      .sort({ createdAt: -1 })
      .lean()
  }

  async getTeamById(teamId: string) {
    await connectDB()
    return Team.findById(teamId).populate('lead', '_id name email image').lean()
  }

  async updateTeam(teamId: string, userId: string, updates: Record<string, unknown>) {
    await connectDB()
    const team = await Team.findById(teamId)
    if (!team) throw new Error('Team not found')
    if (team.lead?.toString() !== userId) throw new Error('Only the team lead can update this team')
    if (updates.name) team.name = updates.name as string
    if (updates.description !== undefined) team.description = updates.description as string
    await team.save()
    return team.toObject()
  }

  async deleteTeam(teamId: string, userId: string) {
    await connectDB()
    const team = await Team.findById(teamId)
    if (!team) throw new Error('Team not found')
    if (team.lead?.toString() !== userId) throw new Error('Only the team lead can delete this team')
    await TeamMembership.deleteMany({ team: teamId })
    await Team.findByIdAndDelete(teamId)
    return { deleted: true }
  }

  async addMember(teamId: string, userId: string) {
    await connectDB()
    const existing = await TeamMembership.findOne({ team: teamId, user: userId })
    if (existing) throw new Error('User is already a team member')
    const membership = await TeamMembership.create({
      team: teamId,
      user: userId,
      role: 'member',
    })
    return membership.toObject()
  }

  async removeMember(teamId: string, userId: string) {
    await connectDB()
    const result = await TeamMembership.deleteOne({ team: teamId, user: userId })
    if (result.deletedCount === 0) throw new Error('Member not found')
    return { removed: true }
  }

  async setLead(teamId: string, userId: string) {
    await connectDB()
    const team = await Team.findById(teamId)
    if (!team) throw new Error('Team not found')
    await TeamMembership.updateOne({ team: teamId, user: team.lead }, { role: 'member' })
    await TeamMembership.updateOne({ team: teamId, user: userId }, { role: 'lead' })
    team.lead = userId as any
    await team.save()
    return team.toObject()
  }

  async getMembers(teamId: string) {
    await connectDB()
    return TeamMembership.find({ team: teamId })
      .populate('user', '_id name email image')
      .sort({ joinedAt: -1 })
      .lean()
  }
}
