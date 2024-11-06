const mongoose= require('mongoose')
const tareaSchema = new mongoose.Schema({
    proyecto: { type: mongoose.Schema.Types.ObjectId, ref: 'Proyecto' },
    titulo:{type:String,required:true},
    descripcion:{type:String},
    estado:{type:String},
    prioridad:{type:Number}
})
const Tareas = mongoose.model('Tareas', tareaSchema);

module.exports = Tareas;